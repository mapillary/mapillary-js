/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React from 'react';

import '../../../../node_modules/mapillary-js/dist/mapillary.css';
import styles from '../examples.module.css';

export default class ViewerComponent extends React.Component {
  constructor(props) {
    super(props);
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    const {init} = this.props;
    init({container: this.containerRef.current});
  }

  componentWillUnmount() {
    const {dispose} = this.props;
    dispose();
  }

  render() {
    return <div ref={this.containerRef} className={styles.mapillaryViewer} />;
  }
}
