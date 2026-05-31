"use client";

export default function Error({ error }: { error: Error }) {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">
        Something went wrong!
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mt-4">{error.message}</p>
    </div>
  );
}
