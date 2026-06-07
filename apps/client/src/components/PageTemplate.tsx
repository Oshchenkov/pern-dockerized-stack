export default function PageTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="text-4xl font-bold text-gray-800 dark:text-gray-200">
        {children}
      </div>
    </div>
  );
}
