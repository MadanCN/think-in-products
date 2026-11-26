import { notFound, permanentRedirect } from "next/navigation";
import { findPublishedBySlug } from "@/lib/repo";
import { pieceUrl } from "@/lib/types";

// Old /p/<slug> links redirect to the piece's section address.
export default async function OldPieceUrl(props: PageProps<"/p/[slug]">) {
  const { slug } = await props.params;
  const piece = await findPublishedBySlug(slug);
  if (!piece) notFound();
  permanentRedirect(pieceUrl(piece));
}
