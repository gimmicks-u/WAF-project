import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Domain } from './entities/domain.entity';

@Injectable()
export class NginxService {
  private readonly logger = new Logger(NginxService.name);
  private readonly nginxConfigPath = '/app/nginx-configs';
  private readonly modSecurityRulesPath = '/app/modsecurity-rules';
  private readonly nginxContainerName = 'waf-nginx';

  /**
   * Generate Nginx server block configuration for a domain
   */
  async generateNginxConfig(domain: Domain): Promise<void> {
    const configFileName = `waf.${domain.user_id}.conf`;
    const configPath = path.join(this.nginxConfigPath, configFileName);

    const nginxConfig = `# WAF Configuration for user ${domain.user_id}
# Domain: ${domain.domain}
# Generated: ${new Date().toISOString()}

server {
    # Listen on HTTP
    listen 8080;
    listen [::]:8080;
    
    # HTTPS is disabled for now; only HTTP is supported
    # To enable HTTPS later, add SSL cert directives and listen 8443 ssl;

    # Server name
    server_name ${domain.domain};
    
    # SSL Configuration (placeholder - configure certificates as needed)
    # ssl_certificate /etc/nginx/ssl/${domain.domain}/cert.pem;
    # ssl_certificate_key /etc/nginx/ssl/${domain.domain}/key.pem;
    
    # Enable ModSecurity WAF
    modsecurity on;
    
    # Load ModSecurity rules for this user
    modsecurity_rules_file /etc/modsecurity.d/owasp-crs/rules/users/customer-${domain.user_id}-rules.conf;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy settings
    location / {
        # Proxy to origin server
        proxy_pass http://${domain.origin_ip};
        
        # Proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Proxy timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Proxy buffering
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Health check endpoint
    location /waf-health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
`;

    try {
      // Write configuration file
      await fs.writeFile(configPath, nginxConfig, 'utf8');
      this.logger.log(
        `Generated Nginx configuration for domain ${domain.domain}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to write Nginx configuration: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Create ModSecurity custom rules file for a user
   */
  async createUserModSecurityRules(userId: string): Promise<void> {
    const rulesFileName = `customer-${userId}-rules.conf`;
    const rulesPath = path.join(this.modSecurityRulesPath, rulesFileName);

    // Always (re)write a sane default to avoid invalid includes
    const modSecurityRules = `# ModSecurity Custom Rules for User ${userId}
# Generated: ${new Date().toISOString()}

# Keep engine ON (the base CRS is loaded by the image's default config)
SecRuleEngine On

# Place your custom rules below. Examples:
#
# Block specific IP
# SecRule REMOTE_ADDR "@ipMatch 123.123.123.123" \
#   "id:900${userId.substring(0, 3)}01,phase:1,deny,status:403,msg:'Blocked specific IP address'"
#
# Block a User-Agent
# SecRule REQUEST_HEADERS:User-Agent "@contains badbot" \
#   "id:900${userId.substring(0, 3)}02,phase:1,deny,status:403,msg:'Blocked bad bot'"
`;

    try {
      await fs.writeFile(rulesPath, modSecurityRules, 'utf8');
      this.logger.log(`Ensured ModSecurity rules file for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to write ModSecurity rules: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove Nginx configuration file for a user
   */
  async removeNginxConfig(userId: string): Promise<void> {
    const configFileName = `waf.${userId}.conf`;
    const configPath = path.join(this.nginxConfigPath, configFileName);

    try {
      await fs.unlink(configPath);
      this.logger.log(`Removed Nginx configuration for user ${userId}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.error(
          `Failed to remove Nginx configuration: ${error.message}`,
        );
        throw error;
      }
    }
  }

  /**
   * Remove ModSecurity rules file for a user
   */
  async removeUserModSecurityRules(userId: string): Promise<void> {
    const rulesFileName = `customer-${userId}-rules.conf`;
    const rulesPath = path.join(this.modSecurityRulesPath, rulesFileName);

    try {
      await fs.unlink(rulesPath);
      this.logger.log(`Removed ModSecurity rules for user ${userId}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.logger.error(
          `Failed to remove ModSecurity rules: ${error.message}`,
        );
        throw error;
      }
    }
  }

  /**
   * Validate Nginx configuration and reload if valid
   */
  async validateAndReloadNginx(): Promise<boolean> {
    try {
      // Test Nginx configuration
      await this.execCommand(`docker exec ${this.nginxContainerName} nginx -t`);
      this.logger.log('Nginx configuration is valid');

      // Reload Nginx
      await this.execCommand(
        `docker exec ${this.nginxContainerName} nginx -s reload`,
      );
      this.logger.log('Nginx reloaded successfully');

      return true;
    } catch (error) {
      this.logger.error(`Nginx validation/reload failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Execute shell command
   */
  private execCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Command failed: ${stderr || error.message}`));
        } else {
          resolve(stdout);
        }
      });
    });
  }

  /**
   * Check if Nginx container is running
   */
  async isNginxRunning(): Promise<boolean> {
    try {
      const result = await this.execCommand(
        `docker ps --filter "name=${this.nginxContainerName}" --filter "status=running" --format "{{.Names}}"`,
      );
      return result.trim() === this.nginxContainerName;
    } catch (error) {
      this.logger.error(`Failed to check Nginx status: ${error.message}`);
      return false;
    }
  }
}
