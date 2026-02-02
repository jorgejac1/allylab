#!/bin/bash
set -e

echo "🔬 AllyLab Accessibility Scanner"
echo "================================"

# Set environment for action (no auth needed for local scans)
export NODE_ENV=development
export DISABLE_AUTH=true
export DISABLE_RATE_LIMITING=true

# Start the API server in the background
cd /allylab
node packages/api/dist/index.js &
API_PID=$!

# Wait for API to be ready
echo "⏳ Starting AllyLab API..."
for i in {1..30}; do
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Error: API failed to start after 30 seconds"
    exit 1
  fi
  sleep 1
done

# Parse inputs
URL="${INPUT_URL}"
STANDARD="${INPUT_STANDARD:-wcag21aa}"
VIEWPORT="${INPUT_VIEWPORT:-desktop}"
FAIL_ON="${INPUT_FAIL_ON:-}"
MAX_PAGES="${INPUT_MAX_PAGES:-1}"
MAX_DEPTH="${INPUT_MAX_DEPTH:-2}"
OUTPUT_FILE="${INPUT_OUTPUT_FILE:-}"

echo ""
echo "📋 Configuration:"
echo "   URL: $URL"
echo "   Standard: $STANDARD"
echo "   Viewport: $VIEWPORT"
echo "   Max Pages: $MAX_PAGES"
echo "   Fail On: ${FAIL_ON:-none}"
echo ""

# Determine scan type
if [ "$MAX_PAGES" -gt 1 ]; then
  echo "🌐 Running site scan (max $MAX_PAGES pages, depth $MAX_DEPTH)..."
  SCAN_CMD="site $URL --max-pages $MAX_PAGES --max-depth $MAX_DEPTH"
else
  echo "📄 Running single page scan..."
  SCAN_CMD="scan $URL"
fi

# Build full command
CMD="node /allylab/packages/cli/dist/index.js $SCAN_CMD --standard $STANDARD --viewport $VIEWPORT --format json"

if [ -n "$FAIL_ON" ]; then
  CMD="$CMD --fail-on $FAIL_ON"
fi

# Run the scan and capture output
set +e
RESULT=$($CMD 2>&1)
EXIT_CODE=$?
set -e

# Try to parse as JSON
if echo "$RESULT" | jq -e . > /dev/null 2>&1; then
  SCORE=$(echo "$RESULT" | jq -r '.score // "N/A"')
  TOTAL=$(echo "$RESULT" | jq -r '.totalIssues // 0')
  CRITICAL=$(echo "$RESULT" | jq -r '.critical // 0')
  SERIOUS=$(echo "$RESULT" | jq -r '.serious // 0')
  MODERATE=$(echo "$RESULT" | jq -r '.moderate // 0')
  MINOR=$(echo "$RESULT" | jq -r '.minor // 0')

  # Set outputs for GitHub Actions
  if [ -n "$GITHUB_OUTPUT" ]; then
    echo "score=$SCORE" >> $GITHUB_OUTPUT
    echo "total-issues=$TOTAL" >> $GITHUB_OUTPUT
    echo "critical=$CRITICAL" >> $GITHUB_OUTPUT
    echo "serious=$SERIOUS" >> $GITHUB_OUTPUT
    echo "moderate=$MODERATE" >> $GITHUB_OUTPUT
    echo "minor=$MINOR" >> $GITHUB_OUTPUT
  fi

  # Save to file if requested
  if [ -n "$OUTPUT_FILE" ]; then
    echo "$RESULT" > "$OUTPUT_FILE"
    if [ -n "$GITHUB_OUTPUT" ]; then
      echo "report-path=$OUTPUT_FILE" >> $GITHUB_OUTPUT
    fi
    echo "📁 Report saved to: $OUTPUT_FILE"
  fi

  # Print summary
  echo ""
  echo "╔════════════════════════════════════╗"
  echo "║         📊 SCAN RESULTS            ║"
  echo "╠════════════════════════════════════╣"
  printf "║  Score:     %-22s ║\n" "$SCORE/100"
  echo "╠════════════════════════════════════╣"
  printf "║  🔴 Critical:  %-19s ║\n" "$CRITICAL"
  printf "║  🟠 Serious:   %-19s ║\n" "$SERIOUS"
  printf "║  🟡 Moderate:  %-19s ║\n" "$MODERATE"
  printf "║  🔵 Minor:     %-19s ║\n" "$MINOR"
  echo "╠════════════════════════════════════╣"
  printf "║  Total Issues: %-19s ║\n" "$TOTAL"
  echo "╚════════════════════════════════════╝"
  echo ""

  # Determine pass/fail message
  if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Scan completed successfully!"
  else
    echo "❌ Scan failed: Issues found matching --fail-on threshold"
  fi
else
  echo "⚠️ Scan output:"
  echo "$RESULT"
fi

# Cleanup
kill $API_PID 2>/dev/null || true

exit $EXIT_CODE