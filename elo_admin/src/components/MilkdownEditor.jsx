import { Crepe } from '@milkdown/crepe';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { readFileAsDataUrl } from '../data/posts.js';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/nord-dark.css';

function EditorSurface({ defaultValue }, ref) {
  const crepeRef = useRef(null);

  useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: defaultValue || '',
      features: {
        [Crepe.Feature.Latex]: false,
        [Crepe.Feature.AI]: false,
        [Crepe.Feature.TopBar]: false,
        [Crepe.Feature.CodeMirror]: false
      },
      featureConfigs: {
        [Crepe.Feature.Placeholder]: {
          text: 'Write in Markdown. Use / to insert an image block, or the Insert image button above.',
          mode: 'block'
        },
        [Crepe.Feature.ImageBlock]: {
          onUpload: readFileAsDataUrl,
          inlineOnUpload: readFileAsDataUrl,
          blockOnUpload: readFileAsDataUrl
        }
      }
    });

    crepeRef.current = crepe;

    return crepe;
  }, []);

  useImperativeHandle(ref, () => ({
    getMarkdown() {
      return crepeRef.current?.getMarkdown() || '';
    }
  }), []);

  return <Milkdown />;
}

const BoundEditor = forwardRef(EditorSurface);

export const MilkdownEditor = forwardRef(function MilkdownEditor({ defaultValue }, ref) {
  return (
    <div className="milkdown-shell">
      <MilkdownProvider>
        <BoundEditor ref={ref} defaultValue={defaultValue} />
      </MilkdownProvider>
    </div>
  );
});
