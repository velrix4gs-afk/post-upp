import { useNavigate } from 'react-router-dom';

interface PostContentProps {
  content: string;
}

export const PostContent = ({ content }: PostContentProps) => {
  const navigate = useNavigate();

  const renderContentWithHashtags = (text: string) => {
    const parts = text.split(/(#\w+)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        const tag = part.slice(1);
        return (
          <button
            key={index}
            onClick={() => navigate(`/hashtag/${tag}`)}
            className="text-primary hover:underline font-medium"
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <p className="text-base mb-3 whitespace-pre-wrap">
      {renderContentWithHashtags(content)}
    </p>
  );
};
