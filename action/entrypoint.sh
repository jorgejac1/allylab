#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 AllyLab Accessibility Scanner${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Parse inputs
URL="${INPUT_URL}"
STANDARD="${INPUT_STANDARD:-wcag21aa}"
VIEWPORT="${INPUT_VIEWPORT:-desktop}"
FAIL_ON="${INPUT_FAIL_ON}"
MAX_PAGES="${INPUT_MAX_PAGES:-1}"
MAX_DEPTH="${INPUT_MAX_DEPTH:-2}"
OUTPUT_FILE="${INPUT_OUTPUT_FILE}"

if [ -z "$URL" ]; then
  echo -e "${RED}Error: URL is required${NC}"
  exit 1
fi

echo -e "URL:      ${YELLOW}$URL${NC}"
echo -e "Standard: ${YELLOW}$STANDARD${NC}"
echo -e "Viewport: ${YELLOW}$VIEWPORT${NC}"
[ -n "$FAIL_ON" ] && echo -e "Fail on:  ${YELLOW}$FAIL_ON${NC}"
echo ""

# Start the API server in background
echo -e "${BLUE}Starting AllyLab API...${NC}"
cd /allylab
node packages/api/dist/index.js &
API_PID=$!

# Wait for API to be ready
echo "Waiting for API to start..."
for i in {1..30}; do
  if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API is ready${NC}"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}Error: API failed to start${NC}"
    exit 1
  fi
  sleep 1
done

echo ""

# Build CLI command
CLI_CMD="node /allylab/packages/cli/dist/index.js"
REPORT_FILE="${OUTPUT_FILE:-/tmp/allylab-report.json}"

if [ "$MAX_PAGES" -gt 1 ]; then
  # Site scan
  echo -e "${BLUE}Running site scan (max $MAX_PAGES pages)...${NC}"
  $CLI_CMD site "$URL" \
    --max-pages "$MAX_PAGES" \
    --max-depth "$MAX_DEPTH" \
    --standard "$STANDARD" \
    --format json \
    --output "$REPORT_FILE" \
    --api-url http://localhost:3001 \
    ${FAIL_ON:+--fail-on "$FAIL_ON"} || SCAN_EXIT=$?
else
  # Single page scan
  echo -e "${BLUE}Running single page scan...${NC}"
  $CLI_CMD scan "$URL" \
    --standard "$STANDARD" \
    --viewport "$VIEWPORT" \
    --format json \
    --output "$REPORT_FILE" \
    --api-url http://localhost:3001 \
    ${FAIL_ON:+--fail-on "$FAIL_ON"} || SCAN_EXIT=$?
fi

# Stop API
kill $API_PID 2>/dev/null || true

# Parse results for GitHub outputs
if [ -f "$REPORT_FILE" ]; then
  SCORE=$(jq -r '.score // .averageScore // 0' "$REPORT_FILE")
  TOTAL=$(jq -r '.totalIssues // 0' "$REPORT_FILE")
  CRITICAL=$(jq -r '.critical // 0' "$REPORT_FILE")
  SERIOUS=$(jq -r '.serious // 0' "$REPORT_FILE")
  MODERATE=$(jq -r '.moderate // 0' "$REPORT_FILE")
  MINOR=$(jq -r '.minor // 0' "$REPORT_FILE")

  # Set GitHub Action outputs
  echo "score=$SCORE" >> $GITHUB_OUTPUT
  echo "total-issues=$TOTAL" >> $GITHUB_OUTPUT
  echo "critical=$CRITICAL" >> $GITHUB_OUTPUT
  echo "serious=$SERIOUS" >> $GITHUB_OUTPUT
  echo "moderate=$MODERATE" >> $GITHUB_OUTPUT
  echo "minor=$MINOR" >> $GITHUB_OUTPUT
  echo "report-path=$REPORT_FILE" >> $GITHUB_OUTPUT

  # Copy to workspace if output file specified
  if [ -n "$OUTPUT_FILE" ] && [ "$OUTPUT_FILE" != "$REPORT_FILE" ]; then
    cp "$REPORT_FILE" "$GITHUB_WORKSPACE/$OUTPUT_FILE" 2>/dev/null || true
    echo "report-path=$OUTPUT_FILE" >> $GITHUB_OUTPUT
  fi

  # Print summary
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${BLUE}📊 Results Summary${NC}"
  echo ""
  echo -e "  Score:     ${GREEN}$SCORE/100${NC}"
  echo ""
  echo "  Issues Found:"
  echo -e "    🔴 Critical:  $CRITICAL"
  echo -e "    🟠 Serious:   $SERIOUS"
  echo -e "    🟡 Moderate:  $MODERATE"
  echo -e "    🔵 Minor:     $MINOR"
  echo "    ────────────────────"
  echo -e "    Total:       $TOTAL"
  echo ""

  # Write job summary
  cat >> $GITHUB_STEP_SUMMARY << EOF
## 🔍 AllyLab Accessibility Scan Results

| Metric | Value |
|--------|-------|
| **URL** | $URL |
| **Score** | $SCORE/100 |
| **Standard** | $STANDARD |

### Issues by Severity

| Severity | Count |
|----------|-------|
| 🔴 Critical | $CRITICAL |
| 🟠 Serious | $SERIOUS |
| 🟡 Moderate | $MODERATE |
| 🔵 Minor | $MINOR |
| **Total** | **$TOTAL** |

EOF

fi

# Exit with scan result
exit ${SCAN_EXIT:-0}