import React, { useState, useEffect, useCallback, useMemo } from 'react';

const TelegramBot = () => {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [botInfo, setBotInfo] = useState(null);
  const [savedConfigs, setSavedConfigs] = useState([]);

  // Load saved configurations on component mount
  useEffect(() => {
    const loadSavedConfigs = () => {
      try {
        const saved = localStorage.getItem('telegramBotConfigs');
        if (saved) {
          const configs = JSON.parse(saved);
          setSavedConfigs(configs);
          
          // Load the first config if available
          if (configs.length > 0) {
            setBotToken(configs[0].botToken);
            setChatId(configs[0].chatId);
          }
        }
      } catch (error) {
        console.error('Error loading saved configs:', error);
      }
    };

    loadSavedConfigs();
  }, []);

  // Save configuration to localStorage
  const saveConfiguration = useCallback(() => {
    if (!botToken.trim() || !chatId.trim()) {
      setStatus({ type: 'error', message: 'Please fill in both Bot Token and Chat ID' });
      return;
    }

    try {
      const newConfig = {
        id: Date.now(),
        botToken: botToken.trim(),
        chatId: chatId.trim(),
        createdAt: new Date().toISOString(),
        name: botInfo?.username || 'Unknown Bot'
      };

      // Check if config already exists
      const existingIndex = savedConfigs.findIndex(
        config => config.botToken === newConfig.botToken && config.chatId === newConfig.chatId
      );

      let updatedConfigs;
      if (existingIndex >= 0) {
        updatedConfigs = [...savedConfigs];
        updatedConfigs[existingIndex] = { ...updatedConfigs[existingIndex], ...newConfig };
      } else {
        updatedConfigs = [newConfig, ...savedConfigs.slice(0, 4)]; // Keep only 5 configs
      }

      setSavedConfigs(updatedConfigs);
      localStorage.setItem('telegramBotConfigs', JSON.stringify(updatedConfigs));
      setStatus({ type: 'success', message: 'Configuration saved successfully!' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Error saving configuration' });
    }
  }, [botToken, chatId, savedConfigs, botInfo]);

  // Get bot information
  const getBotInfo = useCallback(async () => {
    if (!botToken.trim()) {
      setStatus({ type: 'error', message: 'Please enter a bot token first' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const data = await response.json();

      if (data.ok) {
        setBotInfo(data.result);
        setStatus({ type: 'success', message: `Bot connected: @${data.result.username}` });
      } else {
        setBotInfo(null);
        setStatus({ type: 'error', message: data.description || 'Invalid bot token' });
      }
    } catch (error) {
      setBotInfo(null);
      setStatus({ type: 'error', message: 'Error connecting to Telegram API' });
    } finally {
      setIsLoading(false);
    }
  }, [botToken]);

  // Send test message
  const sendTestMessage = useCallback(async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setStatus({ type: 'error', message: 'Please fill in both Bot Token and Chat ID' });
      return;
    }

    if (!testMessage.trim()) {
      setStatus({ type: 'error', message: 'Please enter a test message' });
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: testMessage,
          parse_mode: 'HTML'
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setStatus({ type: 'success', message: 'Test message sent successfully!' });
        setTestMessage('');
      } else {
        setStatus({ type: 'error', message: data.description || 'Failed to send message' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Error sending message to Telegram' });
    } finally {
      setIsTesting(false);
    }
  }, [botToken, chatId, testMessage]);

  // Load saved configuration
  const loadConfig = useCallback((config) => {
    setBotToken(config.botToken);
    setChatId(config.chatId);
    setBotInfo(null);
    setStatus({ type: 'info', message: `Loaded configuration for ${config.name}` });
  }, []);

  // Delete saved configuration
  const deleteConfig = useCallback((configId) => {
    const updatedConfigs = savedConfigs.filter(config => config.id !== configId);
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('telegramBotConfigs', JSON.stringify(updatedConfigs));
    setStatus({ type: 'info', message: 'Configuration deleted' });
  }, [savedConfigs]);

  // Memoized status component
  const StatusMessage = useMemo(() => {
    if (!status.message) return null;

    const bgColor = status.type === 'success' ? 'bg-green-100 text-green-800 border-green-300' :
                   status.type === 'error' ? 'bg-red-100 text-red-800 border-red-300' :
                   'bg-blue-100 text-blue-800 border-blue-300';

    return (
      <div className={`p-4 rounded-lg border ${bgColor} mb-6`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {status.type === 'success' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {status.type === 'error' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {status.type === 'info' && (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{status.message}</p>
          </div>
        </div>
      </div>
    );
  }, [status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Telegram Bot Configuration</h1>
              <p className="text-gray-600 mt-1">Configure your Telegram bot to receive messages from your forms</p>
            </div>
          </div>

          {StatusMessage}

          {/* Bot Information */}
          {botInfo && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Connected Bot Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Bot Name</p>
                  <p className="font-medium text-gray-800">{botInfo.first_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Username</p>
                  <p className="font-medium text-gray-800">@{botInfo.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bot ID</p>
                  <p className="font-medium text-gray-800">{botInfo.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Can Join Groups</p>
                  <p className="font-medium text-gray-800">{botInfo.can_join_groups ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Bot Configuration</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bot Token
                  </label>
                  <input
                    type="password"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    placeholder="Enter your Telegram bot token"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get this from @BotFather on Telegram
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chat ID
                  </label>
                  <input
                    type="text"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    placeholder="Enter chat ID or channel username"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use @userinfobot to get your chat ID
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={getBotInfo}
                    disabled={isLoading || !botToken.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Connecting...
                      </div>
                    ) : (
                      'Verify Bot'
                    )}
                  </button>

                  <button
                    onClick={saveConfiguration}
                    disabled={!botToken.trim() || !chatId.trim()}
                    className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Save Config
                  </button>
                </div>
              </div>
            </div>

            {/* Test Message Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Message</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Message
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Enter a test message to send..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <button
                  onClick={sendTestMessage}
                  disabled={isTesting || !botToken.trim() || !chatId.trim() || !testMessage.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isTesting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Test Message'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Configurations */}
        {savedConfigs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Saved Configurations</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedConfigs.map((config) => (
                <div key={config.id} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-800 truncate">{config.name}</h3>
                    <button
                      onClick={() => deleteConfig(config.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Chat ID: {config.chatId}</p>
                  <p className="text-xs text-gray-500 mb-4">
                    Created: {new Date(config.createdAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => loadConfig(config)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Load Configuration
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Setup Instructions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Creating a Telegram Bot</h3>
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                  Open Telegram and search for @BotFather
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                  Send /newbot command to create a new bot
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                  Follow the instructions to name your bot
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                  Copy the bot token provided by BotFather
                </li>
              </ol>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Getting Your Chat ID</h3>
              <ol className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                  Search for @userinfobot on Telegram
                </li>
                <li className="flex items-start">
                  <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                  Start a conversation with the bot
                </li>
                <li className="flex items-start">
                  <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                  The bot will send you your Chat ID
                </li>
                <li className="flex items-start">
                  <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                  Copy the Chat ID and paste it above
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramBot;
