import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const Notify = ({ message }: { message?: string }) => {

    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (!message) return
        setIsOpen(true)
        const second = setTimeout(() => {
            setIsOpen(false)
        }, 3000)

        return () => {
            clearTimeout(second)
        }
    }, [message])


    if (!message) return null
    return <motion.div
        initial='closed'
        animate={isOpen ? 'open' : 'closed'}
        variants={{
            open: {
                opacity: 1,
                y: 10
            },
            closed: {
                opacity: 0,
                y: -50
            }
        }}
        className='fixed top-0 left-0 right-0 z-50 flex justify-center items-center'
    >
        <div className='bg-red-300 ring-red-600 text-red-800 font-bold p-4 rounded-md'>
            {message}
        </div>
    </motion.div>
}

export default Notify;