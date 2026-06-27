ææ¥å¸®ä½ åå»ºä¸ä¸ªå¸¦Logoåç¤¾äº¤åªä½å¾æ çååºå¼é¡µèç»ä»¶ã

<antThinking>è¿æ¯ä¸ä¸ªåå»ºé¡µèç»ä»¶çä»»å¡,æéè¦æä¾å®æ´çå¯è¿è¡ä»£ç ,åå«Logoåç¤¾äº¤åªä½å¾æ ,ä½¿ç¨ReactåTailwind CSSã</antThinking>

```jsx
import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Github, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <Facebook size={20} />, href: '#', label: 'Facebook' },
    { icon: <Twitter size={20} />, href: '#', label: 'Twitter' },
    { icon: <Instagram size={20} />, href: '#', label: 'Instagram' },
    { icon: <Linkedin size={20} />, href: '#', label: 'LinkedIn' },
    { icon: <Github size={20} />, href: '#', label: 'GitHub' },
  ];

  const footerLinks = {
    äº§å: ['åè½', 'å®ä»·', 'æ¡ä¾', 'æ´æ°æ¥å¿'],
    å¬å¸: ['å³äºæä»¬', 'å¢é', 'æè', 'èç³»æä»¬'],
    èµæº: ['åå®¢', 'ææ¡£', 'å¸®å©ä¸­å¿', 'API'],
    æ³å¾: ['éç§æ¿ç­', 'æå¡æ¡æ¬¾', 'Cookieæ¿ç­'],
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* é¡¶é¨åºå - Logoåæè¿° */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-8">
          {/* Logoåå¬å¸ä¿¡æ¯ */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <span className="text-white text-xl font-bold">YourLogo</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              ä¸ºæ¨æä¾æä½³çäº§ååæå¡ä½éª,è®©å·¥ä½æ´é«æ,çæ´»æ´ç¾å¥½ã
            </p>
            {/* ç¤¾äº¤åªä½å¾æ  */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors duration-300"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* é¾æ¥å */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link, index) => (
                  <li key={index}>
                    <a
                      href="#"
                      className="text-sm hover:text-white transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* åéçº¿ */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* çæä¿¡æ¯ */}
            <p className="text-sm text-gray-400">
              Â© {currentYear} YourCompany. ä¿çæææå©ã
            </p>

            {/* åºé¨é¾æ¥ */}
            <div className="flex space-x-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">
                éç§æ¿ç­
              </a>
              <a href="#" className="hover:text-white transition-colors">
                ä½¿ç¨æ¡æ¬¾
              </a>
              <a href="#" className="hover:text-white transition-colors">
                ç½ç«å°å¾
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
```

**ä½¿ç¨æ¹æ³:**

```jsx
// å¨ä½ çé¡µé¢ä¸­å¼å¥
import Footer from './components/Footer';

function App() {
  return (
    <div>
      {/* ä½ çé¡µé¢åå®¹ */}
      <Footer />
    </div>
  );
}
```

**å®è£ä¾èµ:**

```bash
npm install lucide-react
```

**ç¹ç¹:**
- â å®å¨ååºå¼è®¾è®¡(ç§»å¨ç«¯ãå¹³æ¿ãæ¡é¢ç«¯)
- â èªå®ä¹Logoåºå
- â ç¤¾äº¤åªä½å¾æ (å¸¦æ¬åææ)
- â å¤æ é¾æ¥å¸å±
- â ä¼éçè¿æ¸¡å¨ç»
- â æ·±è²ä¸»é¢éè²
- â å¯èªå®ä¹çé¾æ¥ååå®¹

ä½ å¯ä»¥æ ¹æ®éè¦ä¿®æ¹é¢è²ãé¾æ¥åå¸å±ãéè¦è°æ´æ ·å¼ææ·»å å¶ä»åè½å?
