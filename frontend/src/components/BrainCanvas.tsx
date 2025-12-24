const BrainCanvas = () => {
  return (
        <div className="fixed z-50 w-[80vw] h-[85vh]  top-10 right-5 p-6 bg-gradient-to-br from-gray-900/98 via-gray-800/98 to-gray-900/98 rounded-2xl border border-blue-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-pink-500/10 to-yellow-500/10 blur-2xl opacity-50" />
          <h1 className="relative text-2xl font-bold text-white mb-4 text-center">
            Brain Canvas
          </h1>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gradient-to-br from-gray-900/98 to-gray-800/98 rotate-45 border-r border-b border-blue-500/20" />
        </div>
  );
};

export default BrainCanvas;