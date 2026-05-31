import Link from "next/link";
import Image from "next/image";
import { galleryMapData } from "./mapData";

export default function Gallery() {
  return (
    <main className="container mx-auto">
      <h1 className="text-center text-3xl font-bold my-4">
        Wonders of the World
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {galleryMapData.map((item) => (
          <Link key={item.id} href={`/gallery/${item.id}`}>
            <Image
              alt={item.name}
              src={item.src}
              className="w-full object-cover aspect-square"
            />
          </Link>
        ))}
      </div>
    </main>
  );
}
