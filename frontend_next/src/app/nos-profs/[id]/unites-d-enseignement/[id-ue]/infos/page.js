import InfosUePublic from "@/features/nos_profs/infosUePublic";

export default async function PageInfosUePublic({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  return (
    <div>
      <InfosUePublic ueId={id} />
    </div>
  );
}
