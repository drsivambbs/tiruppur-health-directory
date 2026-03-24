export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-5 bg-gray-200 rounded-full w-2/3" />
        <div className="h-5 bg-gray-200 rounded-full w-12" />
      </div>
      <div className="space-y-2 mt-4">
        <div className="h-4 bg-gray-200 rounded-full w-3/4" />
        <div className="h-4 bg-gray-200 rounded-full w-1/2" />
      </div>
      <div className="mt-4 flex gap-2 pt-3 border-t border-gray-50">
        <div className="h-7 bg-gray-200 rounded-full w-16" />
        <div className="h-7 bg-gray-200 rounded-full w-24" />
      </div>
    </div>
  );
}
