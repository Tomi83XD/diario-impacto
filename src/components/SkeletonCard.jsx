export default function SkeletonCard({ variante = 'normal' }) {
  const esGrande = variante === 'grande';
  const esDestacada = variante === 'destacada';
  const esLista = variante === 'lista';

  if (esLista) {
    return (
      <div className="flex gap-3 p-3 animate-pulse">
        <div className="w-20 h-16 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0"></div>
        <div className="flex-1 space-y-2 py-1">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse ${
      esGrande ? 'h-full' : ''
    }`}>
      <div className={`bg-gray-200 dark:bg-gray-700 w-full ${esGrande ? 'aspect-[16/9]' : 'aspect-video'}`}></div>
      <div className={`p-4 ${esGrande ? 'md:p-6' : ''}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        
        {(esGrande || esDestacada) && (
          <div className="mt-4 space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
          </div>
        )}
      </div>
    </div>
  );
}
