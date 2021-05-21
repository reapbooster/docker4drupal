import React from 'react';
import {render} from 'react-dom';
import App from '/src/App';


class MyComponent extends React.Component {
  render () {
    return (
      <div>
        <App />
      </div>
    );
  }
}

render(<MyComponent/>, document.getElementById('app'));