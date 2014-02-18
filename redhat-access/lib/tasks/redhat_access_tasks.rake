# desc "Explaining what the task does"
# task :redhat_access do
#   # Task goes here
# end
desc 'Compile stand alone engine assets'
task 'assets:precompile:engine' do
  require 'sprockets'
  require 'sprockets/railtie'
  require 'uglifier'
  require 'sass/rails/compressor'
  require File.expand_path('../lib/red_hat_access', __FILE__)

  precompile = [
    'red_hat_access/articles.js',
    'red_hat_access/articles.css'
  ]

  env = Sprockets::Environment.new(RedHatAccess::Engine.root)
  env.js_compressor = Uglifier.new
  env.css_compressor = Sass::Rails::CssCompressor.new

  paths = [
    'app/assets/stylesheets',
    'app/assets/javascripts',
    'vendor/assets/javascripts',
    'vendor/assets/stylesheets',
  ]

  paths.each do |path|
    env.append_path(path)
  end

  target = File.join(RedHatAccess::Engine.root, 'public', 'assets')
  compiler = Sprockets::StaticCompiler.new(env,
    target,
    precompile,
    :manifest_path => File.join(target),
    :digest => true,
    :manifest => true)
  compiler.compile
end
