import React from 'react';
import { motion } from 'framer-motion';

// Mock data for demonstration
const timelineSteps = [
  { name: "R1", status: "to do", date: "22nd Sep", timing: "4pm" },
  { name: "R2", status: "to do", date: "22nd Sep", timing: "2am" },
  { name: "R3", status: "to do", date: "23rd Sep", timing: "2pm" },
  { name: "Finale", status: "to do", date: "23rd Sep", timing: "5pm" }
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function ReviewTimeline() {
  const getStepStyles = (status) => {
    switch (status) {
      case 'done':
        return {
          dot: 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-500/50',
          line: 'bg-gradient-to-r from-orange-500 to-orange-400',
          text: 'text-orange-400'
        };
      case 'current':
        return {
          dot: 'bg-gradient-to-br from-orange-400 to-orange-500 shadow-orange-400/60',
          line: 'bg-gradient-to-r from-orange-400 to-gray-600',
          text: 'text-orange-300'
        };
      default:
        return {
          dot: 'bg-gradient-to-br from-gray-700 to-gray-800',
          line: 'bg-gradient-to-r from-gray-600 to-gray-700',
          text: 'text-gray-400'
        };
    }
  };

  return (
    <motion.div 
      className="bg-transparent rounded-3xl border-2 border-orange-500 overflow-hidden backdrop-blur-sm relative h-full"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="relative z-10 py-5">
        <div className="flex items-center justify-center mb-8">
          <motion.div 
            className="p-4 bg-orange-500/20 rounded-full backdrop-blur-md border border-orange-400/30"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
          >
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </motion.div>
        </div>

        <h2 className="text-2xl font-bold mb-12 text-orange-400 text-center tracking-widest" style={{ fontFamily: 'Orbitron, monospace' }}>REVIEW TIMELINE</h2>
        
        <div className="relative">
          <div className="flex items-start justify-between">
            {timelineSteps.map((step, i) => {
              const styles = getStepStyles(step.status);
              return (
                <motion.div 
                  key={i} 
                  className="flex-1 flex flex-col items-center gap-4 relative text-center"
                  variants={itemVariants}
                >
                  {/* Connecting line to the next dot */}
                  {i < timelineSteps.length - 1 && (
                    <div className={`absolute top-6 left-1/2 w-full h-1 ${styles.line}`} />
                  )}
                  
                  {/* Enhanced timeline dot */}
                  <motion.div 
                    className={`w-12 h-12 rounded-full border-4 flex items-center justify-center text-white font-bold text-lg z-10 shadow-xl ${styles.dot}`}
                    whileHover={{ scale: 1.15 }}
                    animate={step.status === 'current' ? {
                      boxShadow: [
                        "0 0 20px rgba(249, 115, 22, 0.6)",
                        "0 0 40px rgba(249, 115, 22, 0.4)",
                        "0 0 20px rgba(249, 115, 22, 0.6)"
                      ]
                    } : {}}
                    transition={{
                      boxShadow: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    {step.status === 'completed' ? '✓' : i + 1}
                  </motion.div>
                  
                  <motion.div 
                    className="bg-transparent rounded-2xl p-5 w-full min-w-[150px]"
                    whileHover={{ 
                      borderColor: "rgba(249, 115, 22, 1)"
                    }}
                  >
                    <p className={`font-bold text-xl ${styles.text} tracking-wide mb-2`} style={{ fontFamily: 'Orbitron, monospace' }}>
                      {step.name}
                    </p>
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className={`text-sm uppercase tracking-widest px-3 py-1 rounded-full border ${
                        step.status === 'completed' 
                          ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' 
                          : step.status === 'current'
                          ? 'bg-orange-400/20 text-orange-200 border-orange-400/30'
                          : 'bg-gray-700/20 text-gray-400 border-gray-600/30'
                      }`}>
                        {step.status}
                      </span>
                      <span className="text-sm text-gray-400 font-light tracking-wider">
                        {step.date}
                      </span>
                      <span className="text-sm text-orange-300 font-bold tracking-wide">
                        {step.timing}
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
