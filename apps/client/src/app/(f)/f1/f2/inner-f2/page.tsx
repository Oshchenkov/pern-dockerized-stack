import Link from "next/link";

export default function F2InnerPage() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">
        F2 inner Page
      </h1>
      <div>
        <Link href="/f5" className="text-blue-500 hover:underline">
          Go to F5 Page
        </Link>
        <br />
        <Link href="/f1/f2" className="text-blue-500 hover:underline">
          Go to F2 Page
        </Link>
        <br />
        <Link href="/f3" className="text-blue-500 hover:underline">
          Go to F3 Page
        </Link>
        <br />
        <Link href="/f4" className="text-blue-500 hover:underline">
          Go to F4 Page
        </Link>
        <br />
      </div>
    </div>
  );
}
