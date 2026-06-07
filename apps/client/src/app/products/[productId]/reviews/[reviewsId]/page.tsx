export default async function ProductReviewPage({
  params,
}: Readonly<{
  params: Promise<{ productId: string; reviewsId: string }>;
}>) {
  const { productId, reviewsId } = await params;

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">
        Product ID: {productId}, Review ID: {reviewsId}
      </h1>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
        This is the review page for product ID: {productId} and review ID:{" "}
        {reviewsId}.
      </p>
    </div>
  );
}
