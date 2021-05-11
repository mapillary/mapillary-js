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
import ViewerComponent from '../utils/_ViewerComponent';
import {dispose, init} from '../../js/no-cover';

export default function Example() {
  return (
    <Layout title="No Cover" noFooter="true">
      <ViewerComponent init={init} dispose={dispose} />
    </Layout>
  );
}
