/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import React from 'react';
import Layout from '@theme/Layout';
import {Code} from '../../js/components/Code';
import {ViewerComponent} from '../../js/components/ViewerComponent';
import {dispose, init} from '../../js/examples/procedural-data-provider';

export default function Example() {
  const title = 'Procedural Data Provider';
  return (
    <Layout title={title} noFooter="true">
      <ViewerComponent init={init} dispose={dispose} />
      <Code title={title.toLowerCase()} />
    </Layout>
  );
}
