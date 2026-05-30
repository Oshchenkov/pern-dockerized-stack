import Link from "next/link";

export default function F3Page() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">
        F3 Page
      </h1>
      <div>
        <Link href="/f1/f2" className="text-blue-500 hover:underline">
          Go to F2 Page
        </Link>
        <br />
        <Link href="/f3" className="text-blue-500 hover:underline">
          Go to F3 Page
        </Link>
        <br />
      </div>
    </div>
  );
}
