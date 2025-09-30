import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Modal({open, onClose, children, title}){
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-xs grid place-items-center p-4 z-50"
          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} exit={{y:20,opacity:0}}
            className="glass max-w-2xl w-full p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{title}</h3>
              <button className="btn" onClick={onClose}>✕</button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
