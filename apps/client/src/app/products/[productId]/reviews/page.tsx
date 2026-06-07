export default async function ProductRevPage({
  params,
}: Readonly<{
  params: Promise<{ productId: string }>;
}>) {
  const { productId } = await params;

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">
        Product ID: {productId}
      </h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
        This is the product page for product ID: {productId}.
      </p>
    </div>
  );
}
