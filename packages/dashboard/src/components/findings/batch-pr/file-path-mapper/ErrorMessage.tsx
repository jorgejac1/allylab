interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[13px]"
    >
      {message}
    </div>
  );
}
