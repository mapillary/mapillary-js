/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

import styles from './code.module.css';

export function Code(props) {
  const {title} = props;
  const name = title.replace(' ', '-');
  return (
    <a
      className={styles.codeButton}
      href={`https://github.com/mapillary/mapillary-js/blob/main/doc/src/js/examples/${name}.js`}
      rel="noreferrer"
      target="_blank"
      title={`View source code for ${title} on GitHub`}>
      <img
        alt="View source code on GitHub"
        src={useBaseUrl('img/examples/code.svg')}
        className={styles.codeArrows}
      />
    </a>
  );
}
