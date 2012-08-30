require 'spec_helper'

describe FunctionsController do
  ignore_authorization!

  let(:user) { users(:carly) }

  before do
    log_in user
  end

  describe "#index" do
    let(:instanceAccount) { instance_accounts(:iamcarly) }

    let(:database) { gpdb_databases(:bobs_database) }
    let!(:schema) { gpdb_schemas(:bobs_schema) }

    before do
      stub(subject).gpdb_account_for_current_user(schema) { instanceAccount }
      @functions = [
          GpdbSchemaFunction.new("a_schema", "ZOO", "sql", "text", nil, "{text}", "Hi!!", "awesome"),
          GpdbSchemaFunction.new("a_schema", "hello", "sql", "int4", "{arg1, arg2}", "{text, int4}", "Hi2", "awesome2"),
          GpdbSchemaFunction.new("a_schema", "foo", "sql", "text", "{arg1}", "{text}", "hi3", "cross joins FTW")
      ]
      any_instance_of(GpdbSchema) do |schema|
        mock(schema).stored_functions.with_any_args { @functions }
      end
    end

    it "should list all the functions in the schema" do
      mock_present { |model| model.should == @functions }

      get :index, :schema_id => schema.to_param
      response.code.should == "200"
    end

    it "should check for permissions" do
      mock(subject).authorize! :show_contents, schema.gpdb_instance
      get :index, :schema_id => schema.to_param
    end

    generate_fixture "schemaFunctionSet.json" do
      get :index, :schema_id => schema.to_param
    end

  end
end