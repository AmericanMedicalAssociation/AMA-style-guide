# -*- mode: ruby -*-
# vi: set ft=ruby :

%w{ vagrant-hostmanager vagrant-auto_network }.each do |plugin|
    unless Vagrant.has_plugin?(plugin)
        raise "#{plugin} plugin is not installed. Please install with: vagrant plugin install #{plugin}"
    end
end

# tunables
project     = 'AMA-style-guide'
hostname    = "#{project}.local"
# end tunables

Vagrant.configure(2) do |config|

    config.hostmanager.enabled = true
    config.hostmanager.manage_host = true

    config.vm.define "#{project}" do |box|

        box.vm.box = "palantir/drupalbox"
        box.vm.box_version = ">= 0.1.1, < 1.0.0"

        box.vm.provider "vmware_fusion" do |v|
            v.vmx["memsize"] = "2048"
        end

        box.vm.provider "virtualbox" do |vb|
            vb.customize ["modifyvm", :id, "--memory", "2048"]
        end

        box.vm.hostname = "#{hostname}"
        box.vm.network :private_network, :auto_network => true

        box.vm.synced_folder ".", "/vagrant", :disabled => true
        box.vm.synced_folder ".", "/var/www/#{hostname}", :nfs => true

        box.ssh.forward_agent = true

    end

    config.vm.provision "ansible" do |ansible|
        ansible.playbook = "provisioning/AMA-style-guide.yml"

        ansible.groups = {
            "all:children" => ["#{project}"]
        }

        ansible.extra_vars = {
            "project" => project,
            "hostname" => hostname
        }
    end

end
