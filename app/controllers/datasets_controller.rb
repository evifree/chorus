class DatasetsController < GpdbController
  def index
    schema = GpdbSchema.find(params[:schema_id])
    account = authorized_gpdb_account(schema)
    Dataset.refresh(account, schema)

    datasets = schema.datasets.
        with_name_like(params[:filter]).
        order("lower(name)")

    present paginate(datasets)
  end

  def show
    table = Dataset.find_and_verify_in_source(params[:id], current_user)
    present table
  end

  def import
    workspace = Workspace.find(params[:dataset_import]["workspace_id"])
    if workspace.archived?
      head 422
      return
    end

    create_new_table = params[:dataset_import]["new_table"].to_s == "true"

    src_table = Dataset.find(params[:id])
    dst_table_name = params[:dataset_import]["to_table"]
    dst_table = Dataset.find_by_name(dst_table_name)

    unless create_new_table
      raise ApiValidationError.new(:base, :table_not_exists,
                                   { :table_name => dst_table_name }) unless dst_table
      raise ApiValidationError.new(:base, :table_not_consistent,
                                   { :src_table_name => src_table.name,
                                     :dest_table_name => dst_table_name }) unless src_table.dataset_consistent?(dst_table)
    end

    attributes = params[:dataset_import].dup
    src_table.import(attributes, current_user)

    render :json => {}, :status => :created
  end
end