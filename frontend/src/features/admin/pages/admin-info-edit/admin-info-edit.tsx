import { useParams } from 'react-router';
import { InfoEditor } from '../admin-info-create/info-editor';

export default function AdminInfoEdit() {
  const { infoId } = useParams();
  return <InfoEditor key={infoId} mode="edit" infoId={infoId} />;
}
