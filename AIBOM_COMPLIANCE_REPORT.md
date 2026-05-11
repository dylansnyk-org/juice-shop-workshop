# AI Bill of Materials (AIBOM) Compliance Report

**Generated:** January 27, 2026  
**Project:** Juice Shop Workshop  
**Policy Reference:** SECURITY.md - AI Usage Policy

---

## Executive Summary

This report analyzes the AI components discovered in the project against the company's AI Usage Policy. The AIBOM was generated using CycloneDX format and contains comprehensive information about AI models, datasets, libraries, and agents used in the `ai-chat` module.

---

## AI Usage Policy

According to SECURITY.md, only the following model families are permitted:
- ✅ **Llama** (all variants)
- ✅ **GPT-4, GPT-5** (or any model from OpenAI)
- ✅ **Claude Sonnet**

---

## Model Compliance Analysis

### ✅ COMPLIANT MODELS

| Model | Manufacturer | Location | Status |
|-------|--------------|----------|--------|
| **claude-3-5-sonnet-20240620** | Anthropic PBC | `ai-chat/chatbot.py` (lines 18, 27) | ✅ **COMPLIANT** - Claude Sonnet family |
| **gpt-4** | OpenAI, Inc. | `ai-chat/agent.py` (line 11) | ✅ **COMPLIANT** - OpenAI GPT-4 family |
| **meta-llama/Meta-Llama-3-8B-Instruct** | Meta (via Hugging Face) | Dependency chain | ✅ **COMPLIANT** - Llama 3 family |
| **ContactDoctor/Bio-Medical-MultiModal-Llama-3-8B-V1** | ContactDoctor (via Hugging Face) | Dependency chain | ✅ **COMPLIANT** - Llama 3 derivative |
| **mradermacher/Bio-Medical-MultiModal-Llama-3-8B-V1-i1-GGUF** | mradermacher (via Hugging Face) | `ai-chat/minilm.py` (lines 24-27) | ✅ **COMPLIANT** - Llama 3 quantized version |

### ⚠️ NON-COMPLIANT MODELS

| Model | Manufacturer | Location | Issue |
|-------|--------------|----------|-------|
| **Salesforce/blip-vqa-base** | Salesforce (via Hugging Face) | `ai-chat/blip.py` (lines 5-6) | ❌ **NON-COMPLIANT** - BLIP model not in approved list |
| **black-forest-labs/FLUX.1-dev** | Black Forest Labs (via Hugging Face) | `ai-chat/diffusers_example.py` (line 6) | ❌ **NON-COMPLIANT** - FLUX diffusion model not in approved list |
| **sanchit-gandhi/whisper-medium-fleurs-lang-id** | Fine-tuned Whisper (via Hugging Face) | `ai-chat/whisper.py` (lines 5-6) | ❌ **NON-COMPLIANT** - Whisper model not in approved list |
| **sentence-transformers/all-mpnet-base-v2** | Sentence Transformers (via Hugging Face) | `ai-chat/sentencetransformers.py` (line 5) | ❌ **NON-COMPLIANT** - MPNet embedding model not in approved list |

---

## Risk Assessment

### Critical Findings

1. **4 Non-Compliant Models Detected** - 44% of models in use are not approved
2. **Multiple Use Cases** - Non-compliant models span image understanding (BLIP), image generation (FLUX), speech recognition (Whisper), and embeddings (MPNet)
3. **Policy Enforcement Gap** - No automated checks prevent non-compliant model usage

### Model Usage Breakdown

- **Total Models:** 9
- **Compliant:** 5 (56%)
- **Non-Compliant:** 4 (44%)

---

## Detailed Component Inventory

### AI Libraries
- `anthropic` - For Claude API access
- `transformers` - Hugging Face transformers library
- `diffusers` - Hugging Face diffusion models
- `sentence_transformers` - Sentence embedding models
- `torch` - PyTorch deep learning framework

### AI Agents
- `smolagents.agents.ZeroShotAgent` - Agent framework using GPT-4

### AI Tools
- `smolagents.tools.DuckDuckGoSearchTool` - Web search capability
- `smolagents.tools.PythonREPLTool` - Code execution capability

### Datasets (25 identified)
Multiple training datasets from Hugging Face including code_search_net, eli5, ms_marco, natural_questions, and various embedding datasets.

---

## Recommendations

### Immediate Actions Required

1. **Remove or Replace Non-Compliant Models**
   - Replace `Salesforce/blip-vqa-base` with approved alternatives
   - Replace `black-forest-labs/FLUX.1-dev` with approved image generation models
   - Replace `sanchit-gandhi/whisper-medium-fleurs-lang-id` with approved speech models
   - Replace `sentence-transformers/all-mpnet-base-v2` with approved embedding models

2. **Update Code References**
   - `ai-chat/blip.py` - Replace BLIP model
   - `ai-chat/diffusers_example.py` - Replace FLUX model
   - `ai-chat/whisper.py` - Replace Whisper model
   - `ai-chat/sentencetransformers.py` - Replace MPNet model

### Policy Enhancement Recommendations

1. **Expand Approved Model List** - Consider adding:
   - OpenAI Whisper (if speech recognition is needed)
   - OpenAI CLIP or DALL-E (if image tasks are needed)
   - OpenAI embeddings (text-embedding-ada-002 or similar)

2. **Implement Automated AIBOM Checks**
   - Add pre-commit hooks to validate AIBOM compliance
   - Integrate AIBOM generation into CI/CD pipeline
   - Block deployments with non-compliant models

3. **Update Documentation**
   - Clarify if derivative models (fine-tuned versions) are allowed
   - Specify policy for embedding models and specialized tasks
   - Define approval process for new model requests

### Alternative Approved Models

If the use cases require the capabilities of the non-compliant models, consider:

- **For Image Understanding:** Use GPT-4 Vision (OpenAI) or Llama 3.2 Vision
- **For Image Generation:** Use DALL-E 3 (OpenAI) if available
- **For Speech Recognition:** Use OpenAI Whisper API (if OpenAI models are approved)
- **For Embeddings:** Use OpenAI's text-embedding models or Llama-based embeddings

---

## Conclusion

The project has a well-documented AIBOM using industry-standard CycloneDX format. However, **44% of the AI models in use do not comply with the company's AI Usage Policy**. 

The core conversational AI components (Claude Sonnet and GPT-4) are compliant, but auxiliary models for image processing, speech recognition, and embeddings need to be replaced with approved alternatives.

**Action Required:** Review and remediate the 4 non-compliant models before production deployment.

---

## Appendix: File Locations

### Compliant Code
- ✅ `ai-chat/chatbot.py` - Claude Sonnet implementation
- ✅ `ai-chat/agent.py` - GPT-4 agent implementation

### Non-Compliant Code
- ❌ `ai-chat/blip.py` - BLIP image model
- ❌ `ai-chat/diffusers_example.py` - FLUX diffusion model
- ❌ `ai-chat/whisper.py` - Whisper speech model
- ❌ `ai-chat/sentencetransformers.py` - MPNet embedding model
- ⚠️ `ai-chat/minilm.py` - Uses Llama-based model (compliant)

### AIBOM Files
- `aibom.json` - Machine-readable CycloneDX AIBOM
- `ai-chat/aibom.json` - Module-specific AIBOM
- `ai-chat/aibom.html` - Human-readable AIBOM report
