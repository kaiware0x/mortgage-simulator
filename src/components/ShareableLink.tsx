import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { LoanInput } from '../utils/mortgageCalculator';
import { generateShareableUrl } from '../utils/urlEncoder';

interface ShareableLinkProps {
  scenarios: (LoanInput | null)[];
}

export function ShareableLink({ scenarios }: ShareableLinkProps) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasScenarios = scenarios.some((s) => s !== null);

  if (!hasScenarios) {
    return null;
  }

  const url = generateShareableUrl(scenarios);

  const handleCopy = async () => {
    try {
      // Modern Clipboard API (HTTPS環境)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // フォールバック：古い方法（HTTP環境でも動作）
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand('copy');
          if (successful) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } else {
            alert('URLのコピーに失敗しました。手動でコピーしてください。');
          }
        } catch (err) {
          alert('URLのコピーに失敗しました。手動でコピーしてください。');
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('URLのコピーに失敗しました。手動でコピーしてください。');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800">この結果を共有</h2>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
            />
            <button
              onClick={handleCopy}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition whitespace-nowrap"
            >
              {copied ? 'コピー済み!' : 'URLをコピー'}
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowQR(!showQR)}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition whitespace-nowrap"
        >
          {showQR ? 'QRコードを隠す' : 'QRコードを表示'}
        </button>
      </div>

      {showQR && (
        <div className="mt-6 flex justify-center">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <QRCodeSVG value={url} size={200} level="M" />
          </div>
        </div>
      )}
    </div>
  );
}
