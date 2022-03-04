import React from 'react';
import SegmentControl from '../../app/components/SegmentControl';

import renderer from 'react-test-renderer';

it('SegmentControl component renders correctly', (done) => {
  const tree = renderer.create(
    <SegmentControl
      values={[]}
      onTabPress={() => { }}
      selectedIndex={0}
    />
  ).toJSON();
  expect(tree).toMatchSnapshot();
  done();
});
