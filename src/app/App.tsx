import { EditorPage } from '../pages/editor/ui/EditorPage';
import { ViewerPage } from '../pages/viewer/ui/ViewerPage';

export default function App() {
  const isEditor = new URLSearchParams(window.location.search).has('editor');
  return isEditor ? <EditorPage /> : <ViewerPage />;
}
