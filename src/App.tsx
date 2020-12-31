import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { ipcRenderer } from 'electron';

const Loader = () => (
  <div className="sk-cube-grid">
    <div
      style={{
        transform: 'translateX(2px)',
        height: '33%',
        width: '100%',
        flexShrink: 0,
        display: 'flex',
      }}
    >
      <div className="sk-cube sk-cube1" style={{ height: '100%' }} />
      <div className="sk-cube sk-cube2" style={{ height: '100%' }} />
      <div className="sk-cube sk-cube3" style={{ height: '100%' }} />
    </div>
    <div
      style={{
        transform: 'translateX(-2px)',
        height: '33%',
        width: '100%',
        flexShrink: 0,
        display: 'flex',
      }}
    >
      <div className="sk-cube sk-cube4" style={{ height: '100%' }} />
      <div className="sk-cube sk-cube5" style={{ height: '100%' }} />
      <div className="sk-cube sk-cube6" style={{ height: '100%' }} />
    </div>
    <div
      style={{
        transform: 'translateX(-4px)',
        height: '33%',
        width: '100%',
        flexShrink: 0,
        display: 'flex',
      }}
    >
      <div className="sk-cube sk-cube7" style={{ height: '100%' }} />
      <div className="sk-cube sk-cube8" style={{ height: '100%' }} />
      <div className="sk-cube sk-cube9" style={{ height: '100%' }} />
    </div>
  </div>
);

const Item = (props: Record<string, any>) => (
  <div className="Item">
    <div style={{ width: 48, marginRight: 16 }}>
      {!props.finished && <Loader />}
      {props.finished && (
        <div style={{ width: 48 }}>
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 130.2 130.2"
          >
            <circle
              className="path circle"
              fill="none"
              stroke="#03c4a1"
              strokeWidth="8"
              strokeMiterlimit="10"
              cx="65.1"
              cy="65.1"
              r="62.1"
            />
            <polyline
              className="path check"
              fill="none"
              stroke="#03c4a1"
              strokeWidth="8"
              strokeLinecap="round"
              strokeMiterlimit="10"
              points="100.2,40.2 51.5,88.8 29.8,67.5 "
            />
          </svg>
        </div>
      )}
    </div>
    <div style={{ flexGrow: 1 }}>
      {props.path}
      <div style={{ opacity: 0.7 }}>
        {props.isOk ? (
          <div>The Audio is loud enough</div>
        ) : (
          <div>
            Mean Loudness change:{' '}
            <b>
              {props.liftedMean > 0 ? '+' : ''}
              {props.liftedMean}
            </b>
            dB
          </div>
        )}
      </div>
    </div>

    <div>{/* Actions */}</div>
  </div>
);

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function FileSelectorExample() {
  const fileRef = React.useRef();
  // eslint-disable-next-line no-unused-vars
  const [files, setFiles] = React.useState([]);
  const [finishedIds, setFinishedIds] = React.useState([]);
  const [liftedMean, setLiftedMean] = React.useState(0);
  const [finishedInfos, setFinishedInfos] = React.useState({});

  const handleChange = (e: any) => {
    let value = Array.from(e.target.files);
    value = value
      .map((elem) => {
        elem.id = uuidv4();
        return elem;
      })
      .filter((e) => e.type.indexOf('video/') !== -1);
    setFiles(value);
    value.forEach((elem) => {
      ipcRenderer.send('handle-new-file', {
        path: elem.path,
        id: elem.id,
      });
    });
    fileRef.current.value = '';
  };
  React.useEffect(() => {
    ipcRenderer.on('finished-handle-file', (event, arg) => {
      console.log(arg); // prints "pong"
      setFinishedIds(arg.finishedIds);
      setLiftedMean(arg.liftedMean);
      setFinishedInfos(arg.finishedInfos);
    });
    document.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleChange({
        target: {
          files: event.dataTransfer.files,
        },
      });
    });
  }, []);

  return (
    <div>
      <input
        ref={fileRef}
        multiple
        type="file"
        onChange={handleChange}
        style={{ display: 'none' }}
        accept="video/*"
      />
      <button
        style={{ marginBottom: 12 }}
        onClick={() => {
          if (fileRef && fileRef.current) {
            fileRef.current.click();
          }
        }}
      >
        Select Files
      </button>
      <div className="Card" style={files.length ? { width: 700 } : {}}>
        {files.length === 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0.7,
            }}
          >
            <div style={{ padding: 16 }}>
              Drag & Drop a video here or select a file above.
            </div>
          </div>
        )}
        {files.map((e: Record<string, string>) => {
          return (
            <Item
              key={e.id}
              path={e.path}
              liftedMean={(finishedInfos[e.id] || { liftedMean: 0 }).liftedMean}
              finished={finishedIds.indexOf(e.id) !== -1}
              isOk={(finishedInfos[e.id] || { isOk: false }).isOk}
            />
          );
        })}
      </div>
    </div>
  );
}

document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
});

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={FileSelectorExample} />
      </Switch>
    </Router>
  );
}
