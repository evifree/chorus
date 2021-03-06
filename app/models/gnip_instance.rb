class GnipInstance < ActiveRecord::Base
  attr_accessible :name, :stream_url, :description, :username, :password, :owner
  attr_accessor :highlighted_attributes, :search_result_notes

  validates_presence_of :name, :stream_url, :username, :password, :owner
  validates_length_of :name, :maximum => 64

  belongs_to :owner, :class_name => 'User'
  has_many :events, :through => :activities
  has_many :activities, :as => :entity

  searchable do
    text :name, :stored => true, :boost => SOLR_PRIMARY_FIELD_BOOST
    text :description, :stored => true, :boost => SOLR_SECONDARY_FIELD_BOOST
    string :grouping_id
    string :type_name
    string :security_type_name, :multiple => true
  end

  def entity_type_name
    'gnip_instance'
  end

  def self.type_name
    'Instance'
  end
end