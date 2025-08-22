import SearchResults from '@/components/SearchResults';

interface Props {
  params: { searchId: string };
}

export default function SearchResultsPage({ params }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SearchResults searchId={params.searchId} />
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  return {
    title: `Search Results - ${params.searchId.slice(0, 8)}... | Job Search Analyzer`,
    description: 'View your job search results with keyword matching and filtering options.',
  };
}
