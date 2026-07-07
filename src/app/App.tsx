import { ViewerPage } from '../pages/viewer/ui/ViewerPage';

export default function App() {
  const isEditor = new URLSearchParams(window.location.search).has('editor');
  if (isEditor) return <p>에디터는 Task 7에서 구현</p>;
  return <ViewerPage />;
}
