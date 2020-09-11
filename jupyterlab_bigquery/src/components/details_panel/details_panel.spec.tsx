import * as React from 'react';
import { shallow } from 'enzyme';
import { Settings } from 'luxon';

import { DetailsPanel } from './details_panel';
import { SchemaTable, ModelSchemaTable } from '../shared/schema_table';
import {
  FakeDatasetDetailsFull,
  FakeDatasetDetailsEmpty,
  FakeTableDetailsFull,
  FakeTableDetailsEmpty,
  FakeViewDetailsFull,
  FakeModelDetailsFullSchema,
  FakeModelDetailsEmptySchema,
} from './test_helpers';

describe('DetailsPanel', () => {
  const fakeRows = [
    { name: 'name', value: 'value' },
    { name: 'another name', value: 'another value' },
  ];

  const fakeTrainingRows = [
    { name: 'training option', value: 'training value' },
  ];

  beforeEach(() => {
    Settings.defaultZoneName = 'America/Los_Angeles';
  });

  afterEach(() => {
    Settings.defaultZoneName = 'local';
  });

  it('Renders for datasets with description and labels', () => {
    const component = shallow(
      <DetailsPanel
        details={FakeDatasetDetailsFull}
        rows={fakeRows}
        detailsType="DATASET"
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('Renders for datasets without description and labels', () => {
    const component = shallow(
      <DetailsPanel
        details={FakeDatasetDetailsEmpty}
        rows={fakeRows}
        detailsType="DATASET"
      />
    );
    expect(component).toMatchSnapshot();
  });

  it('Renders for tables with all values populated', () => {
    const component = shallow(
      <DetailsPanel
        details={FakeTableDetailsFull}
        rows={fakeRows}
        detailsType="TABLE"
      />
    );
    expect(component).toMatchSnapshot();
    expect(component.find(SchemaTable).exists()).toBeTruthy();
  });

  it('Renders for tables without schema', () => {
    const component = shallow(
      <DetailsPanel
        details={FakeTableDetailsEmpty}
        rows={fakeRows}
        detailsType="TABLE"
      />
    );
    expect(component.find(SchemaTable).exists()).toBeFalsy();
    expect(component).toMatchSnapshot();
  });

  it('Renders a read-only editor for views', () => {
    const component = shallow(
      <DetailsPanel
        details={FakeViewDetailsFull}
        rows={fakeRows}
        detailsType="VIEW"
      />
    );
    expect(component.find('ReadOnlyEditor').exists()).toBeTruthy();
    expect(component).toMatchSnapshot();
  });

  it('Renders for models with label columns and feature columns', () => {
    const component = shallow(
      <DetailsPanel
        details={FakeModelDetailsFullSchema}
        rows={fakeRows}
        trainingRows={fakeTrainingRows}
        detailsType="MODEL"
      />
    );
    expect(component).toMatchSnapshot();
    expect(component.find(ModelSchemaTable).exists()).toBeTruthy();
  });

  it('Renders for models without label columns or feature columns', () => {
    const component = shallow(
      <DetailsPanel
        details={FakeModelDetailsEmptySchema}
        rows={fakeRows}
        trainingRows={fakeTrainingRows}
        detailsType="MODEL"
      />
    );
    expect(component.find(ModelSchemaTable).exists()).toBeFalsy();
    expect(component).toMatchSnapshot();
  });
});
