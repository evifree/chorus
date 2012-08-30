module InstanceStatus

  def self.each_instance(instances)
    instances.each do |instance|
      begin
        #TODO - rename online in HadoopInstance also to state
        if (instance.class.name == "HadoopInstance")
          instance.online = false
        else
          instance.state = "offline" if instance.state == "online"
        end
        yield instance
      rescue => e
        Rails.logger.error "Could not check status: #{e}: #{e.message} on #{e.backtrace[0]}"
      ensure
        instance.touch
        instance.save
      end
    end
  end

  def self.check
    check_hdfs_instances
    check_gpdb_instances
  end

  def self.check_hdfs_instances
    each_instance(HadoopInstance.scoped) do |instance|
      version = Hdfs::QueryService.instance_version(instance)
      if version
        instance.version = version
        instance.online = true
      end
    end
  end

  def self.check_gpdb_instances
    each_instance(GpdbInstance.scoped) do |gpdb_instance|
      Gpdb::ConnectionBuilder.connect!(gpdb_instance, gpdb_instance.owner_account) do |conn|
        gpdb_instance.state = "online"
        version_string = conn.exec_query("select version()")[0]["version"]
        # if the version string looks like this:
        # PostgreSQL 9.2.15 (Greenplum Database 4.1.1.2 build 2) on i386-apple-darwin9.8.0 ...
        # then we just want "4.1.1.2"

        gpdb_instance.version = version_string.match(/Greenplum Database ([\d\.]*)/)[1]
      end
    end
  end
end
