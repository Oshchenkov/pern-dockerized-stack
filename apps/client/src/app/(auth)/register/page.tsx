export default async function RegisterPage() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">
        Register page
      </h1>
    </div>
  );
}
