/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React from 'react';
import {accessToken, mapboxAccessToken} from '../../../.access-token/token';

import styles from './viewer.module.css';

export class ViewerComponent extends React.Component {
  constructor(props) {
    super(props);
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    const {init} = this.props;
    init({
      accessToken,
      mapboxAccessToken,
      container: this.containerRef.current,
    });
  }

  componentWillUnmount() {
    const {dispose} = this.props;
    dispose();
  }

  render() {
    const {style} = this.props;
    return (
      <div
        ref={this.containerRef}
        className={styles.mapillaryViewer}
        style={style ?? {}}
      />
    );
  }
}
