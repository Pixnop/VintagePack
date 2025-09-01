import { motion } from 'framer-motion'
import { 
  ExclamationTriangleIcon,
  GlobeAltIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

interface CorsRequiredPageProps {
  onRetry: () => void
}

export default function CorsRequiredPage({ onRetry }: CorsRequiredPageProps) {
  const corsExtensions = [
    {
      browser: 'Chrome / Edge / Brave',
      name: 'CORS Unblock',
      url: 'https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino',
      icon: '🟢'
    },
    {
      browser: 'Firefox',
      name: 'CORS Everywhere',
      url: 'https://addons.mozilla.org/firefox/addon/cors-everywhere/',
      icon: '🦊'
    },
    {
      browser: 'Safari',
      name: 'CORS Disable',
      url: 'https://apps.apple.com/app/cors-unblock/id1538625777',
      icon: '🍎'
    }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div 
        className="max-w-2xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1, 1.05, 1]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"
          >
            <GlobeAltIcon className="w-12 h-12 text-white" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-primary mb-3">
            Accès VSModDB Requis
          </h1>
          <p className="text-lg text-secondary">
            Pour utiliser VintagePack, vous devez installer une extension CORS
          </p>
        </motion.div>

        {/* Warning */}
        <motion.div 
          className="glass-secondary rounded-2xl p-6 mb-8 border-l-4 border-amber-500"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="flex items-start gap-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-primary mb-2">
                Pourquoi cette extension est nécessaire ?
              </h3>
              <p className="text-secondary text-sm leading-relaxed">
                VintagePack accède directement à l'API officielle de VSModDB pour vous offrir 
                les derniers mods à jour. Les navigateurs bloquent par défaut ces requêtes 
                pour des raisons de sécurité (politique CORS).
              </p>
            </div>
          </div>
        </motion.div>

        {/* Extensions List */}
        <motion.div 
          className="space-y-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
            <ArrowDownTrayIcon className="w-5 h-5 text-amber-500" />
            Choisissez votre navigateur
          </h2>
          
          {corsExtensions.map((ext, index) => (
            <motion.a
              key={ext.browser}
              href={ext.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block glass-secondary rounded-xl p-4 hover:bg-amber-50/50 transition-all group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{ext.icon}</div>
                  <div>
                    <div className="font-semibold text-primary group-hover:text-amber-600 transition-colors">
                      {ext.name}
                    </div>
                    <div className="text-sm text-secondary">
                      Pour {ext.browser}
                    </div>
                  </div>
                </div>
                <motion.div
                  className="text-amber-500"
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </motion.div>
              </div>
            </motion.a>
          ))}
        </motion.div>

        {/* Instructions */}
        <motion.div 
          className="glass-secondary rounded-2xl p-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
            <InformationCircleIcon className="w-5 h-5 text-blue-500" />
            Instructions d'installation
          </h3>
          
          <ol className="space-y-3 text-sm text-secondary">
            <li className="flex items-start gap-3">
              <span className="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
              Cliquez sur l'extension correspondant à votre navigateur ci-dessus
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
              Installez l'extension depuis le store officiel
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
              Activez l'extension (icône dans la barre d'outils)
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
              Rechargez cette page ou cliquez sur "Réessayer"
            </li>
          </ol>
        </motion.div>

        {/* Retry Button */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
        >
          <motion.button
            onClick={onRetry}
            className="btn-primary px-8 py-3 text-lg font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Réessayer
          </motion.button>
          
          <p className="text-xs text-tertiary mt-4">
            Cette page disparaîtra une fois l'extension installée et activée
          </p>
        </motion.div>

        {/* Background decoration */}
        <motion.div
          className="fixed inset-0 pointer-events-none overflow-hidden -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-full" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/5 rounded-full" />
        </motion.div>
      </motion.div>
    </div>
  )
}