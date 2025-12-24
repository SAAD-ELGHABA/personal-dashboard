import {
    Brain
} from 'lucide-react'
import './styles/brain_controller.css';
import BrainCanvas from './BrainCanvas';

const BrainController = () => {
  return (
    <div className="fixed bottom-4 right-6 z-50" >
        <div className="relative inline-block group">
      <button className="relative px-7 py-4 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-pink-600 rounded-2xl hover:from-blue-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 overflow-hidden shadow-lg shadow-blue-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-pink-500 group-hover:opacity-75 transition-opacity" />
        <span className="relative flex items-center gap-3">
          <Brain className="w-5 h-5"/>
          <span className="font-semibold tracking-wide">
            Talk to Mate
          </span>
        </span>
      </button>
      <div className="fixed top-0 right-0 z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 bottom-full flex items-center justify-center -translate-x-1/2 mb-4 transition-all duration-300 ease-out transform group-hover:translate-y-0 translate-y-2 z-50">
        <BrainCanvas/>
      </div>
    </div>

    </div>
  );
};

export default BrainController;


