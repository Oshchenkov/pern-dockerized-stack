import Image from "next/image";
import { GalleryItem, galleryMapData } from "@/app/gallery/mapData";
import Modal from "@/components/Modal";

export default async function PhotoModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const photo: GalleryItem = galleryMapData.find((p) => p.id === id)!;

  if (!photo) {
    return <div>Photo not found</div>;
  }

  return (
    <Modal>
      <Image
        alt={photo.name}
        src={photo.src}
        className="w-full object-cover aspect-square"
      />

      <div className="bg-amber-900 p-4">
        <h2 className="text-xl font-semibold">{photo.name}</h2>
        <h3>{photo.photographer}</h3>
        <h3>{photo.location}</h3>
      </div>
    </Modal>
  );
}
