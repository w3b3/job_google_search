import SearchResults from '@/components/SearchResults';

interface Props {
  params: Promise<{ searchId: string }>;
}

export default async function SearchResultsPage({ params }: Props) {
  const { searchId } = await params;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SearchResults searchId={searchId} />
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { searchId } = await params;
  
  return {
    title: `Search Results - ${searchId.slice(0, 8)}... | Job Search Analyzer`,
    description: 'View your job search results with keyword matching and filtering options.',
  };
}
