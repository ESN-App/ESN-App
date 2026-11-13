import { useParams } from 'react-router';
import { NewsEditor } from '../admin-news-create/news-editor';

export default function AdminNewsEdit() {
  const { newsId } = useParams();
  return <NewsEditor key={newsId} mode="edit" newsId={newsId} />;
}
