import { useParams } from 'react-router';
import { PartnerEditor } from '../admin-partner-create/partner-editor';

export default function AdminPartnerEdit() {
  const { partnerSlug } = useParams();
  return <PartnerEditor key={partnerSlug} mode="edit" partnerSlug={partnerSlug} />;
}
