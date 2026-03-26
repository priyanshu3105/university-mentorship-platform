import { useParams } from 'react-router-dom';

function MentorDetail() {
  const { id } = useParams();
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">Mentor detail</h1>
      <p className="text-gray-600 mt-2">Placeholder – mentor id: {id}</p>
    </div>
  );
}

export default MentorDetail;
