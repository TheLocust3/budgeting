terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.13"
    }
  }

  required_version = ">= 1.1.8"
}

provider "aws" {
  region  = "us-east-1"
}

data "aws_ami" "common_ami" {
  most_recent      = true
  owners           = ["self"]

  filter {
    name   = "name"
    values = ["common-ubuntu-"]
  }
}

data "aws_key_pair" "budgeting" {
  key_name = "budgeting"
}

data "aws_iam_policy" "ecr_access" {
  name = "AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_role" "node" {
  name               = "budgeting_node"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "ecr_access" {
  name       = "ecr_access"
  roles      = [aws_iam_role.node.name]
  policy_arn = data.aws_iam_policy.ecr_access.arn
}


resource "aws_iam_instance_profile" "node" {
  name = "budgeting_node"
  role = aws_iam_role.node.name
}

resource "aws_security_group" "control_plane" {
  name = "control_plane"

  ingress {
    from_port        = 3001
    to_port          = 3001
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
  }

  ingress {
    from_port        = 22
    to_port          = 22
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
  }

  ingress {
    from_port        = 6443
    to_port          = 6443
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_instance" "control_plane" {
  ami                         = data.aws_ami.common_ami.id
  associate_public_ip_address = true
  instance_type               = "t4g.small"
  key_name                    = data.aws_key_pair.budgeting.key_name
  security_groups             = ["${aws_security_group.control_plane.name}"]
  iam_instance_profile        = aws_iam_instance_profile.node.name
  root_block_device {
    volume_size = 32
  }
  user_data                   = <<-EOL
  #!/bin/bash

  cat /home/ubuntu/install.sh | sh -

  sleep 60
  cd /home/ubuntu && ./ecr_refresh.sh

  echo "Control Plane setup complete"
  EOL
}

output "control_plane_ip" {
  value = aws_instance.control_plane.public_ip
}
