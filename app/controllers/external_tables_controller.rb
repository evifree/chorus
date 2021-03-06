class ExternalTablesController < GpdbController
  wrap_parameters :hdfs_external_table, :exclude => []

  def create
    workspace = Workspace.find(params[:workspace_id])
    table_params = params[:hdfs_external_table]
    hdfs_entry = HdfsEntry.find(table_params[:hdfs_entry_id])

    unless workspace.sandbox
      present_validation_error(:EMPTY_SANDBOX)
      return
    end

    account = authorized_gpdb_account(workspace.sandbox)
    url = Gpdb::ConnectionBuilder.url(workspace.sandbox.database, account)

    file_pattern =
        case table_params[:path_type]
          when "directory" then
            "*"
          when "pattern" then
            table_params[:file_pattern]
        end

    e = ExternalTable.build(
      :column_names => table_params[:column_names],
      :column_types => table_params[:types],
      :database => url,
      :delimiter => table_params[:delimiter],
      :file_pattern => file_pattern,
      :location_url => hdfs_entry.url,
      :name => table_params[:table_name],
      :schema_name => workspace.sandbox.name
    )
    if e.save
      Dataset.refresh(account, workspace.sandbox)
      dataset = workspace.sandbox.reload.datasets.find_by_name!(table_params[:table_name])
      create_event(dataset, workspace, hdfs_entry, table_params)
      render :json => {}, :status => :ok
    else
      raise ApiValidationError.new(e.errors)
    end
  end

  private

  def present_validation_error(error_code)
    present_errors({:fields => {:external_table => {error_code => {}}}},
                   :status => :unprocessable_entity)
  end

  def create_event(dataset, workspace, hdfs_entry, table_params)
    event_params = {:workspace => workspace, :dataset => dataset, :hdfs_entry => hdfs_entry }

    case table_params[:path_type]
      when "directory" then
        Events::HdfsDirectoryExtTableCreated.by(current_user).add(event_params)
      when "pattern" then
        Events::HdfsPatternExtTableCreated.by(current_user).add(event_params.merge :file_pattern => table_params[:file_pattern])
      else
        Events::HdfsFileExtTableCreated.by(current_user).add(event_params)
    end
  end
end
